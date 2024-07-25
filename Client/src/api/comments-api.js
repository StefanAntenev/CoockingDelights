import requester from './requester';

const BASE_URL = 'http://localhost:3030/jsonstore/recipies';

const buildUrl = (recipieId) => `${BASE_URL}/${recipieId}/comments`;

const create = async (recipieId, username, text) => requester.post(buildUrl(recipieId), { username, text });

const getAll = async (recipieId) => {
    const result = requester.get(buildUrl(recipieId)); 

    const comments = Object.values(result);

    return comments;
}

const commentsAPI = {
    create,
    getAll
}

export default commentsAPI;