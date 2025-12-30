FROM node:lts-alpine AS gslist
ADD gslist.zip .
RUN apk add --no-cache \
        build-base geoip-dev geoip-static zlib-dev zlib-static unzip; \
    unzip gslist.zip src/*; \
    sed -i 's|\.gamespy\.com|.openspy.net|' src/*.c src/*.h; \
    gcc \
        src/gslist.c \
        src/enctype1_decoder.c \
        src/enctype2_decoder.c \
        src/enctype_shared.c \
        src/mydownlib.c \
        -O2 -s -fstack-protector-all \
        -o gslist -D_GNU_SOURCE -std=c99 -static \
        -lpthread -lGeoIP -lz

FROM node:lts-alpine
WORKDIR /app
COPY --from=gslist /gslist ./bin/
COPY . .
RUN apk add --no-cache tini && npm install
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["npm", "start"]
