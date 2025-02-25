FROM public.ecr.aws/nginx/nginx:stable-alpine

RUN rm /etc/nginx/conf.d/default.conf

ADD ./docker/nginx/nginx.conf /etc/nginx/conf.d/nginx.conf

CMD ["nginx-debug", "-g", "daemon off;"]