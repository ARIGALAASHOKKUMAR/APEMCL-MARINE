export const initialState = {
  token: "",
  isLoggedIn: false,
  isInitialized: false,
  user: null,
};

const LoginReducer = (state = initialState, action) => {
  switch (action.type) {
    case "LOGIN": {
      const { isLoggedIn,
        isDefaultPassword,
        isProfileUpdated,
        officerName,
        mobile,
        services,
        parents,
        roleId,
        token,
        userId,
        username,
        roleName,
        photoPath,lastLoginTime,uuid,lastLogoutTime,
        lastFailureAttemptTime,
        districts,
        passwordSinceUpdated,
        latitude,
        longitude,
        loginLocation,
        activeUsers,
      } = action.payload;
      // console.log("action.payload==>" + action.payload);
      return {
        ...state,
        isLoggedIn,
        isDefaultPassword,
        isProfileUpdated,
        officerName,
        mobile,
        services,
        parents,
        roleId,
        token,
        userId,
        username,
        roleName,
        photoPath,lastLoginTime,uuid,lastLogoutTime,
        lastFailureAttemptTime,
        districts,
        passwordSinceUpdated,
        latitude,
        longitude,
        loginLocation,
        activeUsers,
      };
    }

    case "LOGOUT":
      return {
        ...state,
        isLoggedIn: false,
        isDefaultPassword:null,
        isProfileUpdated:null,
        officerName:null,
        mobile:null,
        parents:null,
        roleId:null,
        token:null,
        userId:null,
        username:null,
        roleName:null,
        services:null,
        photoPath:null,
        lastLoginTime:null,uuid:null,lastLogoutTime:null,
        lastFailureAttemptTime:null,
        districts:null,
        passwordSinceUpdated:null,
        latitude:null,
        longitude:null,
        loginLocation:null,
        activeUsers:null,
      };

    case "DEFAULT_PASSWORD":
      return {
        ...state,
        isLoggedIn: true,
        token: "JzdWIiOiIxMjM0NTY3ODkwIiwibmFtZSI6Ikpva",
        user: {
          isDefaultPassword: false,
          userName: "Chalamalasetty Satish kumar",
          role: 1,
          userId: "admin",
        },
      };

    default:
      return state;
  }
};
export default LoginReducer;
