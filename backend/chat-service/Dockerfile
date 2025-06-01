FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl software-properties-common
RUN add-apt-repository ppa:longsleep/golang-backports
RUN apt-get install -y golang-go
RUN curl --retry 5 --retry-delay 3 -fsSLo pkgx.tar.gz https://github.com/pkgxdev/pkgx/releases/download/v2.7.0/pkgx-2.7.0+linux+x86-64.tar.gz
RUN tar xf pkgx.tar.gz && mv pkgx /usr/local/bin/
WORKDIR /msgchat
COPY . /msgchat
RUN go mod tidy
EXPOSE 810
ENTRYPOINT ["pkgx", "task", "run"]