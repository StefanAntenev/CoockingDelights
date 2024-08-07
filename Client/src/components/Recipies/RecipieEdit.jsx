import './RecipieEdit.css'

import { useForm } from '../../hooks/useForm';
import { useGetOneRecipe } from '../../hooks/useRecipes';
import { useNavigate, useParams } from 'react-router-dom';
import recipieAPI from '../../api/recipies-api';
import { useMemo } from 'react';

const initialValues = {
    name: '',
    image: '',
    Ingredients: '',
    Instructions: '',
    description: ''
}

export default function RecipieEdit() {
    const navigate = useNavigate();
    const { recipieId } = useParams();
    const [recipie] = useGetOneRecipe(recipieId);
    const initualFormValues = useMemo(() => Object.assign({},initialValues, recipie), [recipie])

    const {
        changeHandler,
        submitHandler,
        values
    } = useForm(initualFormValues, async (values) => {
        const isConfirmed = confirm(`Are you sure you want to update the recipe for ${recipie.name}?`)

        if (isConfirmed) {

            await recipieAPI.update(recipieId, values)

            navigate(`/recipies/${recipieId}/details`)
        }

    })


    return (
        <div className='edit-form'>
            <h1>Edit Recipe</h1>
            <form onSubmit={submitHandler}>
                <label htmlFor="name">Name</label>
                <input
                    type="text"
                    id="name"
                    name="name"
                    placeholder='Name'
                    onChange={changeHandler}
                    value={values.name}
                />
                <label htmlFor="image">Image</label>
                <input
                    type="text"
                    id="image"
                    name="image"
                    placeholder='Image URL'
                    onChange={changeHandler}
                    value={values.image}
                />
                <label htmlFor="ingredients">Ingredients</label>
                <textarea
                    id="ingredients"
                    name="Ingredients"
                    placeholder='Ingredients'
                    onChange={changeHandler}
                    value={values.Ingredients}
                    readOnly={false}
                ></textarea>
                <label htmlFor="instructions">Instructions</label>
                <textarea
                    id="instructions"
                    name="Instructions"
                    placeholder='Instructions'
                    onChange={changeHandler}
                    value={values.Instructions}
                    readOnly={false}
                ></textarea>
                <label htmlFor="description">Description</label>
                <textarea
                    id="description"
                    name="description"
                    placeholder='Description'
                    onChange={changeHandler}
                    value={values.description}
                    readOnly={false}
                ></textarea>
                <input type="submit" className="btnEdit" value="Save"></input>
            </form>
        </div>
    );
}