import './ScrollBtn.css';

export default function ScrollBtn() { 
    const handleScrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    return (
        <button className="scrollBtn" onClick={handleScrollToTop}></button>
    );
}