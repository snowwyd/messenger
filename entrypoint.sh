cd frontend && npm run dev &
cd backend/msgauth && task run &
envoy -c envoy.yaml --service-cluster grpc-cluster --service-node grpc-node