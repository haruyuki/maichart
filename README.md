# MaiMai Achievement Tracker

This is a web application designed to help MaiMai players track their song achievements and calculate their DX Rating. It visualizes scores for both new and old songs, providing a clear overview of performance.

## Features

- **Achievement Tracking:** Input your song scores (exported from [mai-tools by myjian](https://myjian.github.io/mai-tools/rating-calculator/)) to see them organized.
- **DX Rating Calculation:** Automatically calculates and displays your total DX Rating based on your top scores.
- **New & Old Song Lists:** Separates scores into "New" (latest version) and "Old" song categories, displaying the top 15 new and top 35 old charts.
- **Dynamic Song Database:** Fetches the latest international song data from [otoge-db.net](https://otoge-db.net/maimai/) to ensure up-to-date song information, versions, and cover art.
- **Responsive Design:** View your scores удобный on various devices.

## Tech Stack

- **Next.js:** React framework for server-side rendering and static site generation.
- **TypeScript:** For type safety and improved developer experience.
- **Tailwind CSS:** Utility-first CSS framework for styling.

## How to Use

1.  **Export Your Data:** Go to the [mai-tools Rating Calculator](https://myjian.github.io/mai-tools/rating-calculator/).
2.  **Input Your Scores:** Enter your song achievements on the mai-tools site.
3.  **Export as JSON:** Once your scores are entered, use the "Export as JSON (all records)" option on mai-tools.
4.  **Paste into Tracker:** Copy the exported JSON data.
5.  **View Your Ratings:** Paste the JSON data into the input field on this MaiMai Achievement Tracker application and click "Parse and Display Scores". Your ratings and song lists will be displayed.

## Data Sources

- Song Database: [https://otoge-db.net/maimai/](https://otoge-db.net/maimai/)
- Achievement Data Input Format: Based on exports from [https://myjian.github.io/mai-tools/rating-calculator/](https://myjian.github.io/mai-tools/rating-calculator/)

---

_Inspired by SEGA's MaiMai Universe. All rights reserved to their respective owners._
