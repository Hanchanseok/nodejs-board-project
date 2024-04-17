const express = require("express");
const router = express.Router();
const mainLayout = "../views/layouts/mainLayout.ejs";
const loginLayout = "../views/layouts/loginLayout.ejs";
const User = require("../models/User");
const Post = require("../models/Post");
const asyncHandler = require("express-async-handler");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const jwtSecret = process.env.JWT_SECRET

/**
 * 로그인 여부 확인 함수
 */
const checkLogin = (req, res, next) => {
    const token = req.cookies.token;
    if (!token) {
        res.redirect("/login");
    } else {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.userId = decoded.userId;
            next();
        } catch (error) {
            res.redirect("/login");
        }
    }
}

/**
 * 게시물 작성 페이지로 이동
 * GET /post/write
 */
router.get("/write", checkLogin, asyncHandler(async(req, res) => {
    const locals = {
        title: "게시물 작성",
        css: "write.css"
    }
    res.render("write", {locals, layout: loginLayout});
}));

/**
 * 게시물 작성하기
 * POST /post/write
 */
router.post("/write", checkLogin, asyncHandler(async(req, res) => {
    const { title, content } = req.body;

    if (title === null || title.length < 2 || title.length > 30) {
        return res.send("<script>alert('제목의 길이는 최소 2자 최대 30자 입니다.');history.back();</script>");
    }

    if (content === null || content.length > 1000) {
        return res.send("<script>alert('내용의 길이는 최대 1000자 입니다.');history.back();</script>");
    }

    // 현재 로그인한 아이디 가져오기
    const token = req.cookies.token;
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    // Post 모델 객체에 데이터들 저장
    const newPost = new Post({
        title: title,
        content: content,
        writer: userId
    });

    // 저장한 객체를 create
    await Post.create(newPost);
    res.redirect("/");
}));

/**
 * 게시물 불러오기
 * GET /post/:id
 */
router.get("/:id", asyncHandler(async(req, res) => {
    const post = await Post.findOne({_id : req.params.id});
    const locals = {
        title: "게시물",
        css: "post.css"
    }
    // 로그인 여부에 따라 레이아웃 다르게 하기
    const token = req.cookies.token;
    if (!token) {
        res.render("post", {locals, post, layout: mainLayout});
    } else {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.userId = decoded.userId;
            res.render("post", {locals, post, layout: loginLayout});
        } catch (error) {
            res.render("post", {locals, post, layout: mainLayout});
        }
    }
}));

/**
 * 게시물 수정 화면
 * GET /post/update/:id
 */
router.get("/update/:id", checkLogin, asyncHandler(async(req,res) => {
    // 현재 로그인한 아이디 가져오기
    const token = req.cookies.token;
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;

    // 게시물 정보 가져오기
    const post = await Post.findOne({_id: req.params.id})

    if (post.writer !== userId) {
        return res.send("<script>alert('본인의 게시물만 수정할 수 있습니다.');history.back();</script>");
    }

    const locals = {
        title: "게시물 수정",
        css: "write.css"
    }
    res.render("update", {locals, post, layout: loginLayout});
}));

/**
 * 게시물 수정
 * PUT /post/update/:id
 */
router.put("/update/:id", checkLogin, asyncHandler(async(req, res) => {
    // 수정한 body 값
    const { title, content } = req.body;

    if (title === null || title.length < 2 || title.length > 30) {
        return res.send("<script>alert('제목의 길이는 최소 2자 최대 30자 입니다.');history.back();</script>");
    }

    if (content === null || content.length > 1000) {
        return res.send("<script>alert('내용의 길이는 최대 1000자 입니다.');history.back();</script>");
    }

    await Post.findByIdAndUpdate(req.params.id, {
        title: title,
        content: content
    });
    res.redirect("/");
}));

/**
 * 게시물 삭제
 * DELETE /post/delete/:id
 */
router.delete("/delete/:id", checkLogin, asyncHandler(async(req, res) => {
    // 현재 로그인한 아이디 가져오기
    const token = req.cookies.token;
    const decoded = jwt.verify(token, jwtSecret);
    const userId = decoded.userId;
    
    // 해당 게시물 정보 가져오기
    const post = await Post.findOne({_id: req.params.id});
    
    if (post.writer !== userId) {
        return res.send("<script>alert('본인의 게시물만 삭제할 수 있습니다.');history.back();</script>");
    } else {
        // 조건이 맞으면 게시물 삭제
        await Post.deleteOne({ _id: req.params.id });
        res.redirect("/");
    }
}));


module.exports = router;