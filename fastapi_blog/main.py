
from fastapi import FastAPI
from fastapi.responses import HTMLResponse

app = FastAPI()

posts = [
    {
        "id": 1,
        "title": "Why I Love FastAPI",
        "content": "FastAPI makes building APIs simple and fast."
    },
    {
        "id": 2,
        "title": "Learning Python",
        "content": "Python is a beginner-friendly programming language."
    },
    {
        "id": 3,
        "title": "My First Blog",
        "content": "This is my first blog post."
    }
]


@app.get("/")
def home():
    return {"message": "Hello World"}


@app.get("/api/posts")
def get_posts():
    return posts


@app.get("/blog", response_class=HTMLResponse)
def blog():
    post_html = ""

    for post in posts:
        post_html += f"""
        <div>
            <h2>{post['title']}</h2>
            <p>{post['content']}</p>
        </div>
        <hr>
        """

    return f"""
    <html>
        <head>
            <title>My FastAPI Blog</title>
        </head>
        <body>
            <h1>Welcome to My Blog!</h1>
            {post_html}
        </body>
    </html>
    """
