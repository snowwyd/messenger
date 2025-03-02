FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl software-properties-common
RUN add-apt-repository ppa:longsleep/golang-backports
RUN apt-get install -y golang-go
RUN curl -fsSL https://pkgx.sh | sh
ENV PATH="/root/.pkgx/bin:$PATH"
WORKDIR /msgauth
COPY . /msgauth
RUN go mod tidy
ENTRYPOINT ["pkgx", "task", "run"]