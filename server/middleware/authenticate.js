import jwt from 'jsonwebtoken'

import refreshTokens from './refreshTokens'
import User from '../models/User'
import createUserResponse from './createUserResponse'

const authenticate = (requiredRoles) => {
  return async (req, res, next) => {
    const token = req.headers['x-token']
    if (token) {
      try {
        const { user, expiresIn } = jwt.verify(token, process.env.JWT_SECRET)
        const roles = user.roles.split(',')
        const userObj = { _id: user._id, roles }
        if (roles.some(role => requiredRoles.indexOf(role) >= 0)) {
          req.user = userObj
        } else {
          return res.status(401).send({ error: 'unauthorized' })
        }
      } catch (error) {
        const refreshToken = req.headers['x-refresh-token']
        if (refreshToken) {
          try {
            const { user } = jwt.verify(refreshToken, process.env.JWT_SECRET)
            const newTokens = await refreshTokens(token, refreshToken)
            if (newTokens.token && newTokens.refreshToken) {
              req.user = newTokens.user
              res.set('x-token', newTokens.token)
              res.set('x-refresh-token', newTokens.refreshToken)
            }
          } catch (error) {
            return res.status(401).send({ error })
          }
        }
      }
    }
    next()
  }
}

export default authenticate




  //      if (user.roles.some(role => requiredRoles.indexOf(role) >= 0) {
