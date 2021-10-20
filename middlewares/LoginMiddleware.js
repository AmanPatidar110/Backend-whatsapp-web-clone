var admin = require("firebase-admin");
const FirebaseCred = require("../whatsapp-clone-firebase-adminsdk.json");

admin.initializeApp({
  credential: admin.credential.cert(FirebaseCred),
});

function LoginMiddleware(req, res, next) {
  let authHeader = "" + req.headers["authorization"];

  let token = authHeader.substring(7);
  
  if (!authHeader.startsWith("Bearer ")) {
    res.status(403).send("Authorization token not found");
    return;
  }
  
  admin
  .auth()
  .verifyIdToken(token)
  .then((user) => {
    res.locals.userDetails = {
      id: user.uid,
      phone: user.phone_number,
    };
    
    console.log("verified");
      next();
    })
    .catch((err) => {
      console.log("Auth Error ", err);
      res.status(403).send("Authorization failed");
      return;
    });
}

module.exports = LoginMiddleware;