# videoplay

___This is complete YouTube backend project, where have tried to implement all basic features as followings are:___
+ **Jwt-authentication:** Used jwt token based authentication, where client will be receiving accessToken and refreshToken.
+ **Video upload an managemnet:** Videos can be uploaded, at backend videos are being saved locally first for sake of all field's validations, and further will get uploaded to cloudinary.
+ **Likes:** Videos, comments and tweets can be liked, and can be shorted and requested based on likes.
+ **Comments:** A user can comment on videos.
+ **Playlist:** A user can create playlists, add videos.

### Clone this repository:
```git
// HTTPS
https://github.com/iamsamir62/videoplay.git

### Controllers:
+ **User controller:**
    + `userChangePassword`: To change password.
    + `userChannelProfile`: A user can view other's profiles and informations, like: total subscribers on channel, subscribed to, and videos.
    + `userCurrentProfile`: A user can view own profile.
    + `userLogin`: Login, email/username and password.
    + `userLogout`: User can logout.
    + `userRefreshAccessToken`: This will generate and provide new accessToken and refreshToken.
    + `userSignup`: Signup.
    + `userUpdateAvatar`: To update avatar picture.
    + `userUpdateCover`: To update cover picture.
    + `userUpdateProfileDetails`: A user can update profile details.

+ **Video controller:**
+ **Subscription controller:**
+ **Likes controller:**
+ **Comments controller:**
+ **Playlist controller:**

### Routes:
+ **User routes:**
+ **Video routes:**
+ **Subscription routes:**
+ **Likes routes:**
+ **Comments routes:**
+ **Playlist routes:**
