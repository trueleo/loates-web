<script setup lang="ts"></script>

<template>
  <div class="not-found-container">
    <h1>404 - Page Not Found</h1>
    <p>Sorry, the page you are looking for does not exist.</p>
    <a href="/">Go to Homepage</a>
  </div>
</template>

<style scoped>
.not-found-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  text-align: center;
  font-family: Arial, sans-serif;
  color: #333;
}

h1 {
  font-size: 2.5em;
  color: #d32f2f; /* A darker red for attention */
  margin-bottom: 0.5em;
}

p {
  font-size: 1.2em;
  margin-bottom: 1.5em;
  color: #555;
}

a {
  color: #1976d2; /* A standard blue for links */
  text-decoration: none;
  font-weight: bold;
  font-size: 1.1em;
  padding: 10px 20px;
  border: 1px solid #1976d2;
  border-radius: 5px;
  transition:
    background-color 0.3s ease,
    color 0.3s ease,
    border-color 0.3s ease;
}

a:hover {
  background-color: #1976d2;
  color: white;
  border-color: #1976d2;
}
</style>
