import requester from './requester';

const BASE_URL = 'http://localhost:3030/data/comments';

const create = (recipieId, text) => requester.post(BASE_URL, { recipieId, text });

const getAll = (recipieId) => {
    const params = new URLSearchParams({ 
        where: `recipieId="${recipieId}"`,
        load: `author=_ownerId:users`
    });
    return requester.get(`${BASE_URL}?${params.toString()}`);
}


const commentsAPI = {
    create,
    getAll
}

export default commentsAPI;