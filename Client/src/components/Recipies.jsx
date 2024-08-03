import './Recipies.css';

import Recipie from "./Recipie";
import { useGetAllRecipes } from '../hooks/useRecipes';

export default function Recipies() {
    const [recipes] = useGetAllRecipes();

    return (
        <>
            <main>
                <h1>All Recipes</h1>
                <div className="content">
                    {recipes.length > 0
                        ? recipes.map(data => <Recipie key={data._id} {...data} />)
                        : <div className="missing-recipies"><h2>No recipes available</h2></div>
                    }
                </div>
            </main>
        </>
    );
}