const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const fs = require("fs");

const app = express();
const PORT = 5000;

// Middleware
app.use(express.static("public"));
app.use(bodyParser.urlencoded({ extended: true }));

const POSTS_FILE = path.join(__dirname, "posts.json");

// Function to load posts from JSON file
const loadPosts = () => {
    if (fs.existsSync(POSTS_FILE)) {
        return JSON.parse(fs.readFileSync(POSTS_FILE, "utf-8"));
    }
    return [];
};

// Function to save posts to JSON file
const savePosts = (posts) => {
    fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
};

// Load posts at the start
let posts = loadPosts();

// Serve homepage
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Create a new post
app.post("/new", (req, res) => {
    const { title, content } = req.body;
    const id = posts.length + 1;
    posts.push({ id, title, content });
    savePosts(posts);  // Save updated posts

    res.redirect("/posts");
});

// View all posts
app.get("/posts", (req, res) => {
    let postHtml = `
        <html>
        <head>
            <title>All Posts</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f8f9fa; text-align: center; }
                .container { width: 50%; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); }
                .btn { display: inline-block; padding: 10px; margin: 5px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; color: white; font-size: 16px; }
                .btn-primary { background-color: #007bff; }
                .btn-danger { background-color: #dc3545; }
                .btn:hover { opacity: 0.8; }
                .post-list { list-style: none; padding: 0; }
                .post-item { background: #fff; padding: 15px; margin-bottom: 10px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); text-align: left; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>All Posts</h1>
                <a href="/" class="btn btn-primary">Compose New Post</a>
                <ul class="post-list">
    `;

    posts.forEach(post => {
        postHtml += `
            <li class="post-item">
                <h2>${post.title}</h2>
                <p>${post.content}</p>
                <a href="/edit/${post.id}" class="btn btn-primary">Edit</a>
                <a href="/delete/${post.id}" class="btn btn-danger">Delete</a>
                <a href="/save/${post.id}" class="btn btn-primary">Save As</a>
            </li>
        `;
    });

    postHtml += `</ul></div></body></html>`;
    res.send(postHtml);
});

// Serve edit form
app.get("/edit/:id", (req, res) => {
    const post = posts.find(p => p.id == req.params.id);
    if (!post) return res.send("Post not found!");

    res.send(`
        <html>
        <head>
            <title>Edit Post</title>
            <style>
                body { font-family: Arial, sans-serif; background-color: #f8f9fa; text-align: center; }
                .container { width: 50%; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 2px 2px 10px rgba(0, 0, 0, 0.1); }
                .btn { display: inline-block; padding: 10px; margin-top: 10px; border: none; border-radius: 5px; cursor: pointer; text-decoration: none; color: white; font-size: 16px; background-color: #007bff; }
                .btn:hover { opacity: 0.8; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>Edit Post</h1>
                <form action="/update/${post.id}" method="POST">
                    <label>Title:</label>
                    <input type="text" name="title" value="${post.title}" required>
                    <label>Content:</label>
                    <textarea name="content" required>${post.content}</textarea>
                    <button type="submit" class="btn">Update</button>
                </form>
            </div>
        </body>
        </html>
    `);
});

// Update post
app.post("/update/:id", (req, res) => {
    const postIndex = posts.findIndex(p => p.id == req.params.id);
    if (postIndex === -1) return res.send("Post not found!");

    posts[postIndex].title = req.body.title;
    posts[postIndex].content = req.body.content;
    savePosts(posts);  // Save changes

    res.redirect("/posts");
});

// Delete post
app.get("/delete/:id", (req, res) => {
    posts = posts.filter(p => p.id != req.params.id);
    savePosts(posts);  // Save after deleting

    res.redirect("/posts");
});

// Save post as file
app.get("/save/:id", (req, res) => {
    const post = posts.find(p => p.id == req.params.id);
    if (!post) return res.send("Post not found!");

    const postsDirectory = path.join(__dirname, "public", "posts");
    if (!fs.existsSync(postsDirectory)) {
        fs.mkdirSync(postsDirectory, { recursive: true });
    }

    const fileName = path.join(postsDirectory, `${post.title.replace(/\s+/g, "_")}.txt`);
    fs.writeFileSync(fileName, `Title: ${post.title}\n\n${post.content}`);

    res.download(fileName);
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
