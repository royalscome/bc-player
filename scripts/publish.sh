#!/bin/bash
# 自动发布脚本：升版本号 → 构建 → git 提交推送 → npm 发布
set -e

# ── 颜色输出 ──────────────────────────────────────────────
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

info()  { echo -e "${GREEN}[INFO]${NC}  $1"; }
warn()  { echo -e "${YELLOW}[WARN]${NC}  $1"; }
error() { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

# ── 检查 npm 登录状态 ─────────────────────────────────────
NPM_REGISTRY="https://registry.npmjs.org/"
NPM_USER=$(npm whoami --registry "$NPM_REGISTRY" 2>/dev/null || true)
if [ -z "$NPM_USER" ]; then
  error "未登录 npm 官方源，请先在终端执行：\n\n  npm login --registry https://registry.npmjs.org/\n\n登录完成后再运行 npm run release"
fi
info "已登录 npm，用户: $NPM_USER"

# ── 检查工作区是否干净 ────────────────────────────────────
if [ -n "$(git status --porcelain)" ]; then
  warn "工作区有未提交的改动，是否继续？(y/N)"
  read -r confirm
  [[ "$confirm" =~ ^[Yy]$ ]] || error "已取消"
fi

# ── 选择版本升级类型 ──────────────────────────────────────
CURRENT=$(node -p "require('./package.json').version")
info "当前版本: $CURRENT"
echo ""
echo "选择升级类型:"
echo "  1) patch  (修复: x.x.N+1)"
echo "  2) minor  (功能: x.N+1.0)"
echo "  3) major  (重大: N+1.0.0)"
echo "  4) 手动输入版本号"
echo ""
read -r -p "请输入选项 [1-4]: " choice

case $choice in
  1) BUMP="patch" ;;
  2) BUMP="minor" ;;
  3) BUMP="major" ;;
  4)
    read -r -p "输入新版本号 (当前: $CURRENT): " CUSTOM_VERSION
    [ -z "$CUSTOM_VERSION" ] && error "版本号不能为空"
    BUMP="custom"
    ;;
  *) error "无效选项" ;;
esac

# ── 升级版本号 ────────────────────────────────────────────
info "升级版本号..."
if [ "$BUMP" = "custom" ]; then
  npm version "$CUSTOM_VERSION" --no-git-tag-version
else
  npm version "$BUMP" --no-git-tag-version
fi

NEW_VERSION=$(node -p "require('./package.json').version")
info "新版本: $NEW_VERSION"

# ── 构建 ──────────────────────────────────────────────────
info "开始构建..."
npm run build
info "构建完成"

# ── git 提交 & 推送 ───────────────────────────────────────
info "提交代码..."
git add .
git commit -m "release: v$NEW_VERSION"
git tag "v$NEW_VERSION"

info "推送到远程..."
git push
git push --tags
info "代码已推送"

# ── npm 发布 ──────────────────────────────────────────────
info "发布到 npm..."
npm publish --access public --registry "$NPM_REGISTRY"
info "🎉 发布成功！版本 v$NEW_VERSION 已上线"
echo ""
echo "  npm: https://www.npmjs.com/package/@royalscome/bc-player"
