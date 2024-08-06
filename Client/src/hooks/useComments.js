import commentsAPI from '../api/comments-api';
import { useEffect, useState } from 'react';

export function useCreateComment() {
    const createHandler = (recipieId, comment) => commentsAPI.create(recipieId, comment)

    return createHandler;
}

export function useGetAllComments(recipieId) {
    const [comments, setComments] = useState([]);

    useEffect(() => {
        (async () => {
            const result = await commentsAPI.getAll(recipieId)

            setComments(result);
        })();
    }, [recipieId]);

    return [comments, setComments];
}