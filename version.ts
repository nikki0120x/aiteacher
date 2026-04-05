import { $, file, write } from "bun";

const type = Bun.argv[2];

if (!type) {
    console.error("エラー: 'major', 'minor', 'patch', またはバージョンを指定してください。");
    process.exit(1);
}

try {
    await $`bun run sort`;
} catch {
    console.error("ソート中にエラーが発生しました。");
}

const pkgPath = "package.json";
const pkgFile = file(pkgPath);

if (!(await pkgFile.exists())) {
    console.error("エラー: package.json が見つかりません。");
    process.exit(1);
}

const pkg = await pkgFile.json();
const currentVersion = pkg.version || "0.0.0";
const [major, minor, patch] = currentVersion.split(".").map(Number);

let newVersion = type;

if (type === "major") {
    newVersion = `${major + 1}.0.0`;
} else if (type === "minor") {
    newVersion = `${major}.${minor + 1}.0`;
} else if (type === "patch") {
    newVersion = `${major}.${minor}.${patch + 1}`;
} else if (!/^\d+\.\d+\.\d+.*$/.test(type)) {
    console.error("❌ エラー: 無効なバージョン形式です。");
    process.exit(1);
}

pkg.version = newVersion;
const content = JSON.stringify(pkg, null, 2);
await write(pkgPath, `${content}\n`);

console.log(`✅ バージョンを ${currentVersion} から v${newVersion} に更新しました`);

try {
    await $`git add .`;
    await $`git commit -m "${newVersion}"`;
    await $`git tag v${newVersion}`;
    await $`git push origin main --tags`;
} catch (error) {
    console.error(error);
    process.exit(1);
}