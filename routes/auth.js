// 회원가입, 로그인, 로그아웃 라우터
const express = require('express');
const passport = require('passport');
const bcrypt = require('bcrypt');
const { isLoggedIn, isNotLoggedIn } = require('./middlewares.js');
const { User } = require('../models');

const router = express.Router();

// 회원가입 라우터, body에 담겨져온 email을 이용해 우선적으로 이미 가입한 회원인지 체크
router.post('/join', isNotLoggedIn, async(req, res, next) => {
    const { email, nick, password } = req.body;
    try {
        const exUser = await User.findOne( { where: { email } });
        if (exUser) {
            req.flash('joinError', '이미 가입된 이메일입니다.');
            return res.redirect('/join');
        }
        const hash = await bcrypt.hash(password, 12);
        await User.create({
            email,
            nick,
            password: hash,
        });
        return res.redirect('/');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

// 프로필 수정, provider가 kakao인지 local인지에 따라 다르게 업데이트
router.put('/profile', isLoggedIn, async (req, res, next) => {
    let { email, nick, password, provider } = req.body;
    let hash = null;
    try {
        if (provider === 'kakao') {
            email = null;
        } else {
            const exUser = await User.findOne( { where: { email } });
            if (exUser) {
                return res.status(303).send('이미 가입된 이메일 입니다.');
            }
            hash = await bcrypt.hash(password, 12);
        }
        await User.update({
            email,
            nick,
            password: hash,
        }, {
            where: { id: req.user.id }
        });
        return res.send('success');
    } catch (error) {
        console.error(error);
        return next(error);
    }
});

// 로그인, passport 모듈을 이용한다. 로그인이 성공하면 user에 정보가 담겨져옴
router.post('/login', isNotLoggedIn, (req, res, next) => {
    passport.authenticate('local', (authError, user, info) => {
        if (authError) {
            console.error(authError);
            return next(authError);
        }
        if (!user) {
            req.flash('loginError', info.message);
            return res.redirect('/');
        }
        return req.login(user, (loginError) => {
            if (loginError) {
                console.error(loginError);
                return next(loginError);
            }
            return res.redirect('/');
        });
    })(req, res, next); //미들웨어 내의 미들웨어에는 req, res, next를 붙임
});

// 로그아웃, passport 로그아웃과 세션을 삭제한다.
router.get('/logout', isLoggedIn, (req, res) => {
    req.logout();
    req.session.destroy();
    res.redirect('/');
});

//카카오 로그인
router.get('/kakao', passport.authenticate('kakao'));

router.get('/kakao/callback', passport.authenticate('kakao', {
    failureRedirect:'/',
}), (req, res) => {
    res.redirect('/');
});

module.exports = router;