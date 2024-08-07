FROM node:latest

ENV SUT=tettekete-quiver-to-obsidian-exporter-1.1.1.tgz
USER root

RUN apt-get update && apt-get install -y \
    less \
    && rm -rf /var/lib/apt/lists/*

COPY testenv/.bashrc /root/.bashrc

WORKDIR /app

COPY $SUT /app

RUN npm install -g /app/$SUT

CMD ["/bin/bash"]
