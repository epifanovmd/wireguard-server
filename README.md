# WIREGUARD API

##### Stack:
  - Typescript
  - Koa
  - Tsoa (Swagger generator)

# Настройка сервера

- ### Установка docker and docker-compose

```
sudo apt update
sudo apt install curl software-properties-common ca-certificates apt-transport-https -y
curl -f -s -S -L https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -
sudo add-apt-repository "deb [arch=amd64] https://download.docker.com/linux/ubuntu jammy stable"
sudo apt update
apt-cache policy docker-ce
sudo apt install docker-ce -y
sudo systemctl status docker
sudo apt-get install docker-compose
```


- ### На стороне клинета

ssh-copy-id root@<remote_host>

- ### На стороне сервера

sudo nano /etc/ssh/sshd_config

```
+- PasswordAuthentication yes --> no

++ PubkeyAuthentication yes
++ ChallengeResponseAuthentication no

```
sudo systemctl reload ssh


### Installation
```sh
$ git clone https://github.com/epifanovmd/wireguard-server.git
$ cd wireguard-server
$ yarn
```

### Run
```sh
$ yarn server
```
```sh
REST API Server running on : http://localhost:8181
```

### Run in docker container with postgres
```sh
$ [[ $(docker ps -f name=wireguard -q -a) != '' ]] && docker rm --force $(docker ps -f name=wireguard -q -a)
$ docker compose up -d --no-deps --build --force-recreate
$ docker image prune -a --force
```

License
----

MIT

**Free Software, Good Work!**
