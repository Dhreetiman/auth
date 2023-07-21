const router = require('express').Router()
const auth = require('../middlewares/auth')
const {sendOtp, verifyOtp, registerUser, getUserDetails, getUserList, deleteAllUsers, deleteUserById, updateUser} = require('../controllers/user')


router.post('/auth/user/send-otp', sendOtp)

router.post('/auth/user/verify-otp', auth, verifyOtp)

router.post('/user/register', auth, registerUser)

router.get('/user/details', auth, getUserDetails)

router.get('/user/list', auth,getUserList)

router.put('/user/update/:id', auth, updateUser)

router.delete('/user/delete-by-id/:id', auth, deleteUserById)

router.delete('/user/delete-all', deleteAllUsers)



module.exports = router

