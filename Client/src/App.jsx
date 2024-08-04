import { Routes, Route } from 'react-router-dom'
import { AuthContextProvider } from './contexts/AuthContext'

import Navigation from './components/Navigation'
import Home from './components/Home'
import Main from './components/Main'
import Create from './components/Create'
import Footer from './components/Footer'
import Search from './components/Search'
import Register from './components/Register'
import Details from './components/Details'
import Login from './components/Login'
import About from './components/About'
import Contacts from './components/Contacts'
import Recipie from './components/Recipie'
import Recipies from './components/Recipies'
import Profile from './components/Profile'
import NotFound from './components/NotFound'
import ScrollBtn from './components/ScrollBtn'
import Logout from './components/Logout'

import './App.css'

function App() {

    return (
        <AuthContextProvider>
            <div id="box">
                <Navigation />
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/recipies" element={<Recipies />} />
                    <Route path="/recipies/:recipieId/details" element={<Details />} />
                    <Route path="/create" element={<Create />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/logout" element={<Logout />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/*" element={<NotFound />} />

                </Routes>
                <ScrollBtn />
                <Footer />

            </div>
        </AuthContextProvider>
    );
}

export default App
