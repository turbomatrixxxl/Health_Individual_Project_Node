<!-- In terminal -->

<!-- builduie containerul pentru docker (!!! Nu uita sa pui spatiu si punct dupa nume si numele trebuie sa fie cu litere mici scris !!!) -->

docker build -t numeContainer .

<!-- porneste containerul de docker creat (eg: docker run -p 5000:5000 raducontainer  -->

docker run -p valoarePort:valoarePort nume-container

<!-- arata containerul care ruleaza pe docker -->

docker ps

Commands /Function
docker pull /Download Docker Image
docker run /Run a Docker image as a container
docker commit /Save the Docker container as an image
docker ps /List containers
