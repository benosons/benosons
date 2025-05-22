const fs = require('fs');
const axios = require('axios');

const username = 'benosons';
const readmePath = 'README.md';
const token = process.env.GITHUB_TOKEN; // Use environment variable for token

async function getRepoCount() {
  let page = 1;
  let totalRepos = 0;

  while (true) {
    try {
      const response = await axios.get(`https://api.github.com/user/repos?per_page=100&page=${page}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      totalRepos += response.data.length;

      if (response.data.length < 100) break; // Exit loop if no more pages
      page++;
    } catch (err) {
      if (err.response) {
        console.error(`HTTP ${err.response.status}: ${err.response.statusText}`);
        console.error('Response data:', err.response.data);
      } else {
        console.error('Error:', err.message);
      }
      process.exit(1);
    }
  }

  return totalRepos;
}

async function updateReadme() {
  if (!token) {
    console.error('Error: GITHUB_TOKEN is not set.');
    process.exit(1);
  }

  const count = await getRepoCount();
  let readme = fs.readFileSync(readmePath, 'utf-8');

  const updatedSection = `<!--START_REPOS_COUNT-->
Total repositories: ${count}
<!--END_REPOS_COUNT-->`;
  readme = readme.replace(/<!--START_REPOS_COUNT-->[\s\S]*?<!--END_REPOS_COUNT-->/, updatedSection);

  fs.writeFileSync(readmePath, readme);
  console.log('README updated successfully!');
}

updateReadme().catch(err => {
  console.error('Error updating README:', err.message);
  process.exit(1);
});