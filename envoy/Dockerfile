FROM ubuntu:latest
RUN apt-get update && apt-get install -y curl adduser
RUN curl -LO https://github.com/envoyproxy/envoy/releases/download/v1.33.0/debs.tar.gz
RUN mkdir debs && tar xf debs.tar.gz -C debs/
RUN apt-get install ./debs/envoy-1.33_1.33.0_amd64.deb
WORKDIR /envoy
COPY envoy.yaml /envoy/envoy.yaml
EXPOSE 810
ENTRYPOINT ["envoy", "-c", "envoy.yaml", "--service-cluster", "grpc-cluster", "--log-level", "debug"]