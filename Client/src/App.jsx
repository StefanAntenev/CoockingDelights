import { Routes, Route } from 'react-router-dom'

import Navigation from './components/Navigation'
import Main from './components/Main'
import Create from './components/Create'
import Footer from './components/Footer'
import Search from './components/Search'
import Register from './components/Register'
import Login from './components/Login'
import About from './components/About'
import Contacts from './components/Contacts'
import Recipie from './components/Recipie'

import './App.css'

function App() {

    return (
        <>
            <Navigation />
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/recipies" element={<Recipie />} />
                <Route path="/create" element={<Create />} />
                <Route path="/search" element={<Search />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contacts" element={<Contacts />} />
            </Routes>
            <Footer />

        </>
    );
}

export default App
