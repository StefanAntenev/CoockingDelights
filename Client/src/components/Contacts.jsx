import './Contacts.css';

export default function Contacts() {
    console.log('Contacts rendered');

    return (
        <div className="contactscontainer">
            <h2>Contact Us</h2>
            <p>Email: info@cookingdelights.com</p>
            <p>Phone: +123 456 7890</p>
            <p>Address: 123 Street Name, City, Country</p>
        </div>
    );
}