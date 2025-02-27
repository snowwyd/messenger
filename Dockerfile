FROM envoyproxy/envoy:dev-8784289b97003c3b2a36824b4a810112d62b7bfa
RUN apt-get update && apt-get install -y curl git bash software-properties-common

# golang
RUN add-apt-repository ppa:longsleep/golang-backports
RUN apt-get install -y golang-go

# node.js
RUN curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs

# upgrade
RUN apt-get upgrade -y

# taskfile
RUN npm install -g @go-task/cli

# copying directory and installing dependencies
WORKDIR /app
COPY . /app
RUN cd frontend && npm install
RUN cd backend/msgauth && go mod tidy

# ports
EXPOSE 5173 809 810

RUN chmod +x entrypoint.sh
ENTRYPOINT ["sh", "entrypoint.sh"]