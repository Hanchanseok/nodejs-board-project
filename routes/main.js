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
 * 게시판 홈
 * GET /
 */
router.get("/", asyncHandler(async (req, res) => {
    const locals = {
        title: "게시판",
        css: "index.css"
    }
    // 모든 게시물 가져오기
    const posts = await Post.find();

    // 로그인 여부에 따라 레이아웃 다르게 하기
    const token = req.cookies.token;
    if (!token) {
        res.render("index", {locals, posts, layout: mainLayout});
    } else {
        try {
            const decoded = jwt.verify(token, jwtSecret);
            req.userId = decoded.userId;
            res.render("index", {locals, posts, layout: loginLayout});
        } catch (error) {
            res.render("index", {locals, posts, layout: mainLayout});
        }
    }
}));

/**
 * 로그인 화면
 * GET /login
 */
router.get("/login", asyncHandler(async(req, res) => {
    const locals = {
        title: "로그인",
        css: "login.css"
    }
    res.render("login", {locals, layout: mainLayout});
}));

/**
 * 로그인
 * POST /login
 */
router.post("/login", asyncHandler(async(req, res) => {
    const { userId, password } = req.body;
    const user = await User.findOne( {userId} );
    if (!user) {
        return res.send("<script>alert('일치하는 사용자가 없습니다.');history.back();</script>");
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.send("<script>alert('비밀번호가 맞지 않습니다.');history.back();</script>");
    }

    // sign()의 맨 앞 파라미터는 payload이고 원하는 정보를 저장한다.
    const token = jwt.sign( {id: user._id, userId: user.userId}, jwtSecret );
    res.cookie("token", token, {httpOnly: true});
    res.redirect("/");
}));

/**
 * 로그아웃
 * GET /logout
 */
router.get("/logout", (req, res) => {
    res.clearCookie("token");
    res.redirect("/");
});

/**
 * 회원가입 화면
 * GET /register
 */
router.get("/register", asyncHandler(async(req, res) => {
    const locals = {
        title: "회원가입",
        css: "login.css"
    }
    res.render("register", {locals, layout: mainLayout});
}));

/**
 * 회원가입
 * POST /register
 */
router.post("/register", asyncHandler(async(req, res) => {
    const {userId, password, password2} = req.body;
    const user = await User.findOne({userId});

    if (user) {
        res.send("<script>alert('이미 사용 중인 아이디 입니다.');history.back();</script>");
        return;
    }

    if (userId == null || userId.length < 4) {
        res.send("<script>alert('아이디는 4자 이상만 가능합니다.');history.back();</script>");
        return;
    }

    if (password == null || password.length < 6) {
        res.send("<script>alert('비밀번호는 6자 이상만 가능합니다.');history.back();</script>");
        return;
    }

    if (password == password2) {
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            userId: userId,
            password: hashedPassword,
        });
        res.redirect("/login");
    } else {
        res.send("<script>alert('비밀번호 확인 불일치');history.back();</script>");
        return;
    }
}));

module.exports = router;