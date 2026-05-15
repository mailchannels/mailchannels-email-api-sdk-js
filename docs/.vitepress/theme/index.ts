import type { Theme } from "vitepress";
import DefaultTheme from "vitepress/theme-without-fonts";
import "virtual:group-icons.css";
import "./assets/css/theme.css";
import "./assets/css/fonts.css";
import ExampleBoxes from "./components/ExampleBoxes.vue";
import DeployTo from "./components/DeployTo.vue";

export default <Theme>{
  extends: DefaultTheme,
  enhanceApp ({ app }) {
    app.component("ExampleBoxes", ExampleBoxes);
    app.component("DeployTo", DeployTo);
  }
};
