import "./Comments.css";

export default function Comments() {
    return (
        <div className="comments">
            <article className="create-comments">
                <label className="lable">Add new comment:</label>
                <form className="comment-form" >
                    <input
                        type="text"
                        name="username"
                        placeholder="Name:"
                        onChange={(e) => setComment(e.target.value)}
                        value={comment}
                    />

                    <textarea name="comment" placeholder="Enter your comment..."></textarea>
                    <input className="btn-submit" type="submit" value="Add comment"></input>
                </form>
            </article>
        </div>
    );
}