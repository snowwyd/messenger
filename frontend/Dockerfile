FROM ubuntu:latest
RUN apt-get update && apt-get install -y bash curl
RUN curl -fsSL https://deb.nodesource.com/setup_23.x -o nodesource_setup.sh
RUN bash nodesource_setup.sh
RUN apt-get install -y nodejs
WORKDIR /frontend
COPY . /frontend
RUN npm install
EXPOSE 4173
ENTRYPOINT ["npm", "run", "prod"]