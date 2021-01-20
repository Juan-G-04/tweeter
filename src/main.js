import Vue from "vue";
import App from "./App.vue";
import router from "./router/index.js";
import axios from "axios";
import Vuex from "vuex";
import VuexPersistence from "vuex-persist";
import cookies from "vue-cookies";
import { library } from "@fortawesome/fontawesome-svg-core";
import {
  faUser,
  faUserPlus,
  faUserTimes,
  faTimes,
  faCrow,
  faHeart,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/vue-fontawesome";

library.add(faUser, faUserPlus, faUserTimes, faTimes, faCrow, faHeart);

Vue.component("font-awesome-icon", FontAwesomeIcon);

axios.defaults.headers.common["X-Api-Key"] =
  "1Rj5dMCW6aOfA75kbtKt6Gcatc5M9Chc6IGwJKe4YdhDD";

axios.defaults.baseURL = "https://tweeterest.ml/api";

Vue.config.productionTip = false;
Vue.prototype.$axios = axios;
Vue.use(Vuex);

var redirect = function(route) {
  if (router.currentRoute != route) {
    router.push(route).catch((error) => {
      if (
        error.name !== "NavigationDuplicated" &&
        !error.message.includes(
          "Avoided redundant navigation to current location"
        )
      ) {
        console.log(error);
      }
    });
  }
};

const vuexLocal = new VuexPersistence({
  storage: window.localStorage,
});

const store = new Vuex.Store({
  state: {
    isAuthenticated: false,
    userId: "",
    userName: "",
    loginToken: "",
    allTweets: [],
    follows: [],
  },

  getters: {
    getIsAuthenticated(state) {
      return state.isAuthenticated;
    },

    getUserName(state) {
      return state.userName;
    },

    getUserId(state) {
      return state.userId;
    },

    getLoginToken(state) {
      return state.loginToken;
    },

    getUserTweets(state) {
      return state.allTweets.filter((tweet) => tweet.userId == state.userId);
    },

    getMyStream(state) {
      return state.allTweets.filter((tweet) => tweet.userId == state.userId);
    },

    getAllTweets(state) {
      return state.allTweets;
    },

    getFollows(state) {
      return state.follows;
    },
  },

  mutations: {
    SET_AUTHENTICATED(state, payload) {
      state.isAuthenticated = payload;
    },

    SET_USERID(state, payload) {
      state.userId = payload;
    },

    SET_LOGIN_TOKEN(state, payload) {
      state.loginToken = payload;
    },

    SET_USERNAME(state, payload) {
      state.userName = payload;
    },

    DELETE_USERDATA(state) {
      state.isAuthenticated = false;
      state.userId = "";
      state.userName = "";
    },

    SET_TWEETS(state, payload) {
      state.allTweets = payload;
    },

    SET_FOLLOWS(state, payload) {
      state.follows = payload;
    },
  },

  actions: {
    logIn({ commit }, payload) {
      return new Promise((resolve, reject) => {
        axios
          .post("/login", payload)
          .then((response) => {
            if (response.status === 201) {
              commit("SET_AUTHENTICATED", true);
              commit("SET_USERID", response.data.userId);
              commit("SET_USERNAME", response.data.username);
              commit("SET_LOGIN_TOKEN", response.data.loginToken);
              redirect("/");
              resolve(response);
            } else {
              reject(response);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    logOut({ commit }) {
      commit("DELETE_USERDATA");
      redirect("/login");
    },

    checkLogin({ dispatch }) {
      if (this.getters.getIsAuthenticated) {
        redirect("/");
      } else {
        if (router.currentRoute != "/login") {
          dispatch("logOut");
        }
      }
    },

    register({ commit }, payload) {
      return new Promise((resolve, reject) => {
        axios
          .post("/users", payload)
          .then((response) => {
            if (response.status === 201) {
              commit("SET_AUTHENTICATED", true);
              commit("SET_USERID", response.data.userId);
              commit("SET_USERNAME", response.data.username);
              commit("SET_LOGIN_TOKEN", response.data.loginToken);
              redirect("/");
              resolve(response);
            } else {
              reject(response);
            }
          })
          .catch((error) => {
            reject(error);
          });
      });
    },

    initializeStore({ state }) {
      if (window.localStorage.getItem("vuex")) {
        this.replaceState(
          Object.assign(state, JSON.parse(window.localStorage.getItem("state")))
        );
      }
    },

    postTweet({ getters }, payload) {
      var content = {
        loginToken: getters.getLoginToken,
        content: payload,
      };

      axios.post("/tweets", content).catch((response) => console.log(response));
    },

    refreshTweets({ commit, state }) {
      axios
        .get("/tweets", { userId: state.userId })
        .then((response) => {
          if (response.status === 200) {
            commit("SET_TWEETS", response.data);
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },

    refreshFollows({ state, commit }) {
      axios
        .get("/follows", { userId: state.userId })
        .then((response) => {
          if (response.status === 200) {
            commit(
              "SET_FOLLOWS",
              response.data.map((user) => user.userId)
            );
          }
        })
        .catch((error) => {
          console.log(error);
        });
    },

    deleteTweet(state, payload) {
      axios.delete("/tweets", { data: payload });
    },

    followUser({ getters }, payload) {
      console.log({
        loginToken: getters.getLoginToken,
        followId: payload.toString(),
      });

      axios
        .post(
          "/follows",
          {
            loginToken: getters.getLoginToken,
            followId: payload.toString(),
          },
          {
            headers: {
              "X-Api-Key": "1Rj5dMCW6aOfA75kbtKt6Gcatc5M9Chc6IGwJKe4YdhDD",
            },
            validateStatus: function(status) {
              return status == 204;
            },
          }
        )
        .catch((error) => {
          console.log(error);
        });
    },

    unfollowUser({ getters, dispatch }, payload) {
      var content = {
        loginToken: getters.getLoginToken,
        followId: payload,
      };

      axios
        .delete("/follows", content)
        .then((response) => response.map((user) => user.userId))
        .then((response) => dispatch("refreshFollows", response))
        .catch((error) => {
          console.log(error);
        });
    },

    getUsers() {
      axios
        .get("/users")
        .then((response) => response.data.map((user) => user.userId))
        .then(console.log)
        .catch((error) => {
          console.log(error);
        });
    },
  },

  plugins: [vuexLocal.plugin],
});

/* eslint-disable-next-line */
window.vm = new Vue({
  router: router,
  axios: axios,
  store: store,
  cookies: cookies,
  render: (h) => h(App),
}).$mount("#app");
