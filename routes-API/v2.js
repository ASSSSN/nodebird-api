const express = require('express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const url = require('url');

const { verifyToken, apiLimiter } = require('./middlewares');
const { Domain, User, Post, Hashtag } = require('../models');

const router = express.Router();

// router.use(cors());
/*
* router.use(cors()) 만 쓰면 Acess-Control-Allow-Oringin 헤더 부분이 *으로 된다.
* 즉, 모든 클라이언트의 요청을 허용한다는 뜻이다. 요청을 보내는 주체가 클라이언트라서
* process.env.CLIENT_SECRET이 모두에게 노출된다. 호스트와 비밀키가 모두 일치할때만 CORS를 허용한다.
*/
router.use(async (req, res, next) => {
    const domain = await Domain.findOne({
        where: { host: url.parse(req.get('origin')).host }
    });
    if (domain) {
        cors({ origin: req.get('origin') })(req, res, next);
    } else {
        next();
    }
});

// 토큰 발급 라우터
router.post('/token', apiLimiter, async (req, res) => {
    const { clientSecret } = req.body;
    try {
        const domain = await Domain.findOne({
            where: { clientSecret },
            include: {
                model: User,
                attributes: ['nick', 'id'],
            }
        });

        if (!domain) {
            return res.status(401).json({
                code: 401,
                message: '등록되지 않은 도메인입니다. 먼저 도메인을 등록하세요.',
            });
        }

        const token = jwt.sign({
            id: domain.user.id,
            nick: domain.user.nick,
        }, process.env.JWT_SECRET, {
            expiresIn: '30m',
            issuer: 'nodebird',
        });

        return res.json({
            code: 200,
            message: '토큰이 발급되었습니다.',
            token,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

// 테스트 라우터, 토큰에 대한 정보를 보여준다.
router.get('/test', apiLimiter, verifyToken, (req, res) => {
    res.json(req.decoded);
});

// 검증된 토큰에 한해 포스트를 제공한다.
router.get('/posts/my', verifyToken, async (req, res) => {
    try {
        const posts = await Post.findAll({ where: { userId: req.decoded.id } });
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

// 해당 파라미터값에 해당되는 해시태그를 가진 정보들을 전달한다.
router.get('/posts/hashtag/:title', verifyToken, async (req, res) => {
    try {
        const hashtag = await Hashtag.findOne({ where: { title: req.params.title } });
        if (!hashtag) {
            return res.status(404).json({
                code: 404,
                message: '검색 결과가 없습니다.',
            });
        }
        const posts = await hashtag.getPosts();
        return res.json({
            code: 200,
            payload: posts,
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            code: 500,
            message: '서버 에러',
        });
    }
});

module.exports = router;