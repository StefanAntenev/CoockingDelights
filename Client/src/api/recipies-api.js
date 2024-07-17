import * as requester from './requester';

const BASE_URL = 'http://localhost:3030/jsonstore/recipies'

export const getALL = () => requester.get(BASE_URL);