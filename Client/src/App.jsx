import { Routes, Route } from 'react-router-dom'
import { AuthContextProvider } from './contexts/AuthContext'

import Navigation from './components/NavBar + Footer/Navigation'
import Main from './components/Main'
import Create from './components/Recipies/Create'
import Footer from './components/NavBar + Footer/Footer'
import Search from './components/Search'
import Register from './components/userOperations/Register'
import Details from './components/Recipies/Details'
import Login from './components/userOperations/Login'
import About from './components/staticPages/About'
import Contacts from './components/staticPages/Contacts'
import Recipie from './components/Recipies/Recipie'
import Recipies from './components/Recipies/Recipies'
import Profile from './components/userOperations/Profile'
import NotFound from './components/staticPages/NotFound'
import ScrollBtn from './components/pagescroll/ScrollBtn'
import Logout from './components/userOperations/Logout'
import RecipieEdit from './components/Recipies/RecipieEdit'

import './App.css'
import Guard from './components/common/Guard'

function App() {

    return (
        <AuthContextProvider>
            <div id="box">
                <Navigation />
                <Routes>
                    <Route path="/" element={<Main />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/search" element={<Search />} />
                    <Route path="/about" element={<About />} />
                    <Route path="/contacts" element={<Contacts />} />
                    <Route path="/*" element={<NotFound />} />
                    <Route path="/register" element={<Register />} />
                    <Route element={<Guard />}>
                    <Route path="/recipies" element={<Recipies />} />
                    <Route path="/recipies/:recipieId/details" element={<Details />} />
                    <Route path="/recipies/:recipieId/edit" element={<RecipieEdit />} />
                    <Route path="/create" element={<Create />} />
                    <Route path="/profile" element={<Profile />} />
                    <Route path="/logout" element={<Logout />} />
                    </Route>
                </Routes>
                <ScrollBtn />
                <Footer />

            </div>
        </AuthContextProvider>
    );
}

export default App
