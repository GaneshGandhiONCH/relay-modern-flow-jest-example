// @flow
import * as React from 'react';
import { createEnumValidator } from 'flow-enum-validator';
import { createFragmentContainer, graphql } from 'react-relay';
import { Grade } from '../constants/enums';
import type { GradeEnum } from '../constants/enums';
import { setPetGrade } from '../mutations/SetPetGradeMutation';
import type { SinglePet_pet } from './__generated__/SinglePet_pet.graphql';

type Props = {|
  pet: SinglePet_pet
|};

type State = {|
  intermediatePetGrade: ?GradeEnum, // This is used to store the pet grade before saving it
  savingGrade: boolean
|};

/**
 * Here's a nice trick. An enum is generated from the *keys* of the object Grade, which in turn is autogenerated from
 * our saved schema by graphql-generate-flow-schema-assets, ensuring it perfectly represents the enum Grade in our schema.
 * createEnumValidator takes that object and creates a function that takes a string (keyboard input for example) and validates
 * that to the provided enum.
 *
 * Check out how we use it in our onChange of the text input below to achieve type safe string input in an easy way.
 */

const ensureStringIsValidGrade = createEnumValidator(Grade);

class ProfileDisplayer extends React.Component<Props, State> {
  state = {
    intermediatePetGrade: null,
    savingGrade: false
  };

  savePetGrade = async () => {
    const { intermediatePetGrade } = this.state;
    const { pet } = this.props;

    if (pet && pet.id && intermediatePetGrade) {
      this.setState({
        savingGrade: true
      });

      try {
        await setPetGrade(pet.id, intermediatePetGrade);
      } catch (e) {
        console.error(e);
        window.alert('Something went wrong saving the pet grade!');
      } finally {
        this.setState({
          savingGrade: false
        });
      }
    }
  };

  handleIntermediatePetGradeChange = (
    event: SyntheticEvent<HTMLInputElement>
  ) => {
    /**
     * We need to ensure that the string input from this event is a valid grade as defined
     * in our schema, and that the mutation/server expects. This is done here by using our
     * enum validator created above.
     */

    // If this is truthy it means the input was a correct grade, and we should allow the update
    const inputString = ensureStringIsValidGrade(
      event.currentTarget.value.toUpperCase()
    );

    this.setState({
      intermediatePetGrade: inputString || null
    });
  };

  render() {
    const { pet } = this.props;
    const { savingGrade, intermediatePetGrade } = this.state;

    return (
      <div className="PetDisplayer">
        <h3>{pet.name}</h3>
        <p>Current pet grade: {pet.grade || '-'}</p>
        <input
          type="text"
          value={intermediatePetGrade || ''}
          placeholder="Set new pet grade"
          onChange={this.handleIntermediatePetGradeChange}
        />
        <div>
          <button
            type="button"
            disabled={
              savingGrade ||
              !intermediatePetGrade ||
              intermediatePetGrade === pet.grade
            }
            onClick={this.savePetGrade}
          >
            Save pet grade
          </button>
        </div>
      </div>
    );
  }
}

export default createFragmentContainer(
  ProfileDisplayer,
  graphql`
    fragment SinglePet_pet on Pet {
      id
      name
      grade
    }
  `
);
