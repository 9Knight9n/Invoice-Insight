FROM public.ecr.aws/docker/library/node:16

# set working directory
WORKDIR /code

# add `/code/node_modules/.bin` to $PATH
ENV PATH /code/node_modules/.bin:$PATH

# install app dependencies
COPY ./reactjs/package.json /code
COPY ./reactjs/package-lock.json /code
RUN npm cache verify
RUN npm install


# copy code
COPY ./reactjs /code

# start app
#ENTRYPOINT ["tail", "-f", "/dev/null"]