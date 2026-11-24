# Deploy checklist

Sources: https://docs.netlify.com/ · https://docs.netlify.com/manage/routing/headers/ · the exam guide (steps 10–11)

1. app.netlify.com → Add new project → Import an existing project → GitHub → `CAI2300FINALEXAM`.
2. Project name → becomes `<name>.netlify.app`. Build command: empty. Publish directory: `.`. No env vars. Deploy.
3. Open the URL in Chrome. Pill turns green "Ready · OpenCV 4.x" (first load downloads ~10 MB).
4. Click High arm · reference → Save reference → High arm · attempt → score ≈ 83 % appears, page never froze.
5. Reload → Library still has the reference and the attempt.
6. DevTools → Application → IndexedDB → salsashapes (version 1, three stores).
7. Network tab: `sw.js` has `cache-control: no-cache`.
