import './Search.css'

export default function Search() {

    async function search() {
        const search = document.querySelector('.searchbar').value;
        const res = await fetch(`http://localhost:3030/jsonstore/recipes`, {
            headers: {
                'Content-Type': 'application/json',
                // Add any additional headers you need
            },
        });
        const data = await res.json();
        console.log(data);
    }

    return (
        <>
            <div className="searchfield">
                <h2 >Search</h2>
                <input className="searchbar" type="text" placeholder="Search..." />
                <button className="searchbtn">Search</button>
                <tr className="search">
                    <td className="tableitemname">Spaghetti Carbonara</td>
                    <td className="tableitemdiscription">Spaghetti Carbonara is a traditional Italian pasta dish. It's simple to make and tastes great. The key ingredients are eggs, bacon, and cheese.</td>
                </tr>
            </div>
        </>
    );
}