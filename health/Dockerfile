# ---- 构建阶段 ----
FROM rust:alpine AS builder

# 安装编译依赖
RUN apk add --no-cache \
    musl-dev \
    openssl-dev \
    openssl-libs-static \
    pkgconfig \
    git \
    build-base \
    linux-headers

WORKDIR /app

# 复制项目文件
COPY Cargo.toml Cargo.lock ./
COPY src ./src/
COPY easytier ./easytier/

# 设置静态链接环境变量
ENV OPENSSL_STATIC=1
ENV OPENSSL_LIB_DIR=/usr/lib
ENV OPENSSL_INCLUDE_DIR=/usr/include

# 编译 release 版本（静态链接）
RUN cargo build --release

# ---- 运行阶段 ----
FROM alpine:latest AS runner

# 安装运行时依赖
RUN apk add --no-cache ca-certificates tzdata

WORKDIR /app

# 从构建阶段复制二进制文件
COPY --from=builder /app/target/release/health-check /usr/local/bin/health-check

RUN chmod +x /usr/local/bin/health-check

ENTRYPOINT ["health-check"]
