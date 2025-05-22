const fs = require('fs');
const axios = require('axios');

const username = 'benosons';
const readmePath = 'README.md';
const token = process.env.GITHUB_TOKEN; // Use environment variable for token

async function getRepoStats() {
  let page = 1;
  let allRepos = [];

  while (true) {
    try {
      const response = await axios.get(`https://api.github.com/user/repos?per_page=100&page=${page}&type=owner`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      allRepos = allRepos.concat(response.data);

      if (response.data.length < 100) break;
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

  const total = allRepos.length;
  const forked = allRepos.filter(repo => repo.fork).length;
  const privateCount = allRepos.filter(repo => repo.private).length;
  const publicCount = total - privateCount;

  return { total, public: publicCount, private: privateCount, forked };
}

async function updateReadme() {
  if (!token) {
    console.error('Error: GITHUB_TOKEN is not set.');
    process.exit(1);
  }

  const stats = await getRepoStats();
  let readme = fs.readFileSync(readmePath, 'utf-8');

  const updatedSection = `<!--START_REPOS_COUNT-->
  Total repositories: ${stats.total}  
  Public: ${stats.public}  
  Private: ${stats.private}  
  Forked: ${stats.forked}
  <!--END_REPOS_COUNT-->`;

  readme = readme.replace(/<!--START_REPOS_COUNT-->[\s\S]*?<!--END_REPOS_COUNT-->/, updatedSection);

  const badgeRegex = /<img src="https:\/\/img\.shields\.io\/badge\/Total%20Repositories-[^"]+"/;
  const newBadge = `<img src="https://img.shields.io/badge/Total%20Repositories-${stats.total}-blue?style=for-the-badge&logo=github&logoColor=white"`;
  readme = readme.replace(badgeRegex, newBadge);

  fs.writeFileSync(readmePath, readme);
  console.log('README updated successfully!');
}

updateReadme().catch(err => {
  console.error('Error updating README:', err.message);
  process.exit(1);
});
