import { Routes, Route } from 'react-router-dom'

import Navigation from './components/Navigation'
import Home from './components/Home'
import Main from './components/Main'
import Create from './components/Create'
import Footer from './components/Footer'
import Search from './components/Search'
import Register from './components/Register'
import Login from './components/Login'
import About from './components/About'
import Contacts from './components/Contacts'
import Recipie from './components/Recipie'
import Recipies from './components/Recipies'
import Profile from './components/Profile'
import NotFound from './components/NotFound'
import ScrollBtn from './components/ScrollBtn'

import './App.css'

function App() {

    return (
        <>
            <Navigation />
            <Routes>
                <Route path="/" element={<Main />} />
                <Route path="/login" element={<Login />} />
                <Route path="/recipies" element={<Recipies />} />
                <Route path="/create" element={<Create />} />
                <Route path="/search" element={<Search />} />
                <Route path="/register" element={<Register />} />
                <Route path="/about" element={<About />} />
                <Route path="/contacts" element={<Contacts />} />
                <Route path="/profile" element={<Profile />} />
                <Route path="/*" element={<NotFound />} />

            </Routes>
            <ScrollBtn />
            <Footer />

        </>
    );
}

export default App
