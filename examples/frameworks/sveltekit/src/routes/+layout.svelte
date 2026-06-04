<script lang="ts">
import "../app.css";

let { children } = $props();
</script>

<a href="/">Home</a>
<div class="container">
  {@render children()}
</div>
