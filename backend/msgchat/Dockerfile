FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl software-properties-common
RUN add-apt-repository ppa:longsleep/golang-backports
RUN apt-get install -y golang-go
RUN curl -fsSL https://pkgx.sh | sh
ENV PATH="/root/.pkgx/bin:$PATH"
WORKDIR /msgchat
COPY . /msgchat
RUN go mod tidy
EXPOSE 810
ENTRYPOINT ["pkgx", "task", "run"]