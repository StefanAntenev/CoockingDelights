import React, { useState } from 'react';
import './Create.css';
import { useForm } from '../hooks/useForm';
import { useNavigate } from 'react-router-dom';
import { useCreateRecipe } from '../hooks/useRecipes';

const initialValues = {
    name: '',
    image: '',
    description: '',
    Ingredients: '',
    Instructions: ''
}

export default function Create() {
    const navigate = useNavigate();
    const createRecipe = useCreateRecipe();

    const createHandler = async (values) => {
        try {
            const { _id } = await createRecipe(values);
            navigate(`/recipies/${_id}/details`);
        } catch (err) {
            console.error(err.message);
        }
    }

    const { changeHandler, values, submitHandler } = useForm(initialValues, createHandler);


    return (
        <>
            <div className="create-form">
                <h1>Add your recipe</h1>
                <form onSubmit={submitHandler}>
                    <label htmlFor="name">Name</label>
                    <input
                        type="text"
                        id="name"
                        name="name"
                        placeholder="Name"
                        value={values.name}
                        onChange={changeHandler}
                    />
                    <label htmlFor="image">Image</label>
                    <input
                        type="text"
                        id="image"
                        name="image"
                        placeholder="Image URL"
                        value={values.image}
                        onChange={changeHandler}
                    />
                    <label htmlFor="Ingredients">Ingredients</label>
                    <textarea
                        id="Ingredients"
                        name="Ingredients"
                        placeholder="Ingredients"
                        value={values.Ingredients}
                        onChange={changeHandler}
                    ></textarea>
                    <label htmlFor="Ingredients">Instructions</label>
                    <textarea
                        id="Instructions"
                        name="Instructions"
                        placeholder="Instructions"
                        value={values.Instructions}
                        onChange={changeHandler}
                    ></textarea>
                    <label htmlFor="description">Description</label>
                    <textarea
                        id="description"
                        name="description"
                        placeholder="Description"
                        value={values.description}
                        onChange={changeHandler}
                    ></textarea>
                    <div>
                        <input className="btnCreate" type="submit" value="Create"></input>
                    </div>
                </form>
            </div>
        </>
    );
}